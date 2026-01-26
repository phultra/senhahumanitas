import { Component, OnInit, signal } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { DadosSenha } from '../../interface/dadossenha';
import { AdminService } from '../../service/admin/admin.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { get, ref } from 'firebase/database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verifica-senha',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, ReactiveFormsModule, FormsModule],
  templateUrl: './verifica-senha.component.html',
  styleUrl: './verifica-senha.component.scss'
})
export class VerificaSenhaComponent implements OnInit {
  carregando = signal<boolean>(false);
  operadorLogado = signal<string>('Renato Machado');
  senhaEmEdicao = signal<DadosSenha | null>(null);
  editNome = '';
  editMedico = '';
  verdade:boolean = false
  medicos: any[] = []; // Lista de médicos
  operador: string ='';
   // Array para armazenar as senhas geradas
  senhasDisponiveis: DadosSenha[] = [];
  dadosNovosSenha: DadosSenha = new DadosSenha;

  //VARIÁVEL QUE CRIA FORMULARIO
  formulario!: FormGroup;
  nomeUsuario: string = '';
  
  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private router: Router
    
  ) {

  }

  ngOnInit(): void {
    this.operadorLogado.set( this.adminService.getDadosLogado());
    this.operador = this.adminService.getDadosLogado()
    this.formbuilder();
    this.carregaMedicos();
    this.adminService.getSenhaGeradaConvencional().subscribe(d => {
     // this.repetirSenha = d;
    // this.senhasDisponiveis = d.filter(s => s.status === '2');
    });

    this.buscarSenhasChamadasEpreenchidasPeloOperador()

  }

  irparaverificasenha(){
    this.adminService.setDadosLogado(this.nomeUsuario);
    this.router.navigate(['/operador'])
}

  // Criação do formulário de login do operador
  formbuilder(){
    this.formulario = this.formBuilder.group({
      medico: ['',[Validators.required, Validators.minLength(6)]],
      nome: ['',[Validators.required, Validators.minLength(6)]],
    })      
  }

    //Função que permite operador verificar todas as senhas alteradas e/ou Chamadas
  async buscarSenhasChamadasEpreenchidasPeloOperador(): Promise<DadosSenha[]> {
    try {
      // Agora apenas aguardamos o resultado uma única vez
      const senhas = await this.adminService.getSenhaChamadaPeloOperadorVerificacao(); 
      this.senhasDisponiveis = senhas
      console.log('Senhas Disponiveis:', this.senhasDisponiveis);

      if (!senhas || senhas.length === 0) {
        console.warn('Nenhuma senha disponível para chamada.');
        return [];
      }

      // Elimina duplicatas baseado no campo 'senha'
     // this.senhasDisponiveis =Array.from(new Set(senhas.map((s) => s.senha)))
     /* const senhasUnicas = Array.from(new Set(senhas.map((s) => s.senha)))
        .map((senhaUnica) => senhas.find((s) => s.senha === senhaUnica)!);

      return senhasUnicas;*/
      return this.senhasDisponiveis;

    } catch (error) {
      console.error('Erro ao buscar senhas para chamada:', error);
      throw error;
    }
  }


  fecharEdicao() {
    this.senhaEmEdicao.set(null);
  }

  abrirEdicao(senha: DadosSenha) {
    this.senhaEmEdicao.set(senha);
    this.editNome = senha.nome;
    this.editMedico = senha.medico;
  }


  salvarEdicao() {
    const senhatual  = this.senhaEmEdicao();
     console.log(senhatual);
     senhatual!.medico = this.editMedico;
     senhatual!.nome = this.editNome;
     senhatual!.status = "3";
     console.log(senhatual);
    
     this.adminService.updateSenhaoperador(senhatual!);
    
    this.carregando.set(false);
    this.fecharEdicao();
  
  }

  // Método para carregar os médicos do nó "medicos"
  async carregaMedicos() {
   
    this.medicos =  await this.adminService.getMedicos()
    console.log(this.medicos);
        
  }

  getSetorClass(setor: string): string {
    if (setor === 'CONSULTA') return 'senha-consulta';
    if (setor === 'REALIZAR AGENDAMENTO') return 'senha-agendamento';
    if (setor === 'EXAME') return 'senha-exames';
    if (setor === 'RESULTADO DE EXAMES') return 'senha-resultado';
    return '';
  }


 
 

}
