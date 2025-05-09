import { Component } from '@angular/core';
import { MenuComponent } from "../menu/menu/menu.component";
import { FormsModule } from '@angular/forms';
import { Database, push, ref, set, get, child } from '@angular/fire/database';

@Component({
  selector: 'app-consultorios',
  standalone: true,
  imports: [MenuComponent, FormsModule],
  templateUrl: './consultorios.component.html',
  styleUrl: './consultorios.component.scss'
})
export class ConsultoriosComponent {
  numero: string = '';

  constructor(private db: Database) {}

  salvarConsultorio() {
    if (this.numero.trim()) {
      const consultoriosRef = ref(this.db, 'consultorios');

      // Verifica os consultórios existentes para evitar duplicação
      get(child(consultoriosRef, '/')).then((snapshot) => {
        const consultorios = snapshot.exists() ? snapshot.val() : {};
        const existe = Object.values(consultorios).some((c: any) => c.numero === this.numero);

        if (existe) {
          alert('Este número de consultório já está cadastrado.');
        } else {
          const newConsultorioRef = push(consultoriosRef);
          set(newConsultorioRef, { numero: this.numero })
            .then(() => {
              this.numero = ''; // Limpa o campo após salvar
              alert('Consultório salvo com sucesso!');
            })
            .catch((error) => {
              console.error('Erro ao salvar consultório:', error);
              alert('Erro ao salvar consultório. Tente novamente.');
            });
        }
      }).catch((error) => {
        console.error('Erro ao verificar consultórios existentes:', error);
        alert('Erro ao salvar consultório. Tente novamente.');
      });
    } else {
      alert('Por favor, insira o número do consultório.');
    }
  }
}