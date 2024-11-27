import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  
  //VARIÁVEL QUE CRIA FORMULARIO
  formulario!: FormGroup;
  quantSetores: Array<any> =[];
  

  constructor(
    private formBuilder: FormBuilder,
  ){

  }

   // Método de inicialização do componente
  ngOnInit() {
    this.form();
  }


   // Getter para acessar o FormArray 'setores' dentro do formulário
  get setores(): FormArray {
    return this.formulario.get('setores') as FormArray;
  }

  // Getter para acessar o FormArray 'guiches' dentro do formulário
  get guiches(): FormArray {
    return this.formulario.get('guiches') as FormArray;
  }


  // Função para criar um novo grupo de campos para 'setor', com validação obrigatória
  novoSetor(): FormGroup {
    return this.formBuilder.group({
      nomeSetor: ['', Validators.required]
    });
  }
  
  // Função para criar um novo grupo de campos para 'guiche', com validação obrigatória
  novoGuiche(): FormGroup {
    return this.formBuilder.group({
      nomeGuiche: ['', Validators.required]
    });
  }

   // Função para adicionar um novo setor ao FormArray 'setores'
  adicionarSetor() {
    this.setores.push(this.novoSetor());
  }
  // Função para adicionar um novo guichê ao FormArray 'guiches'
  adicionarGuiche() {
    this.guiches.push(this.novoGuiche());
  }

   // Função para remover um setor do FormArray 'setores' baseado no índice
  removerSetor(index: number) {
    this.setores.removeAt(index);
  }
   // Função para remover um guichê do FormArray 'guiches' baseado no índice
  removerGuiche(index: number) {
    this.guiches.removeAt(index);
  }

 
    // Função para realizar o cadastro com os dados do formulário
  cadastrar() {
    // Lógica de cadastro
    console.log(this.formulario.value);
  }

  // Função chamada quando o valor do select muda
  onSelectChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    console.log('Valor selecionado:', selectedValue);
    // Aqui você pode usar o valor selecionado conforme necessário
    if (selectedValue === '02') {
      this.quantSetores = [1,2];

    }
  }


  
  // Função para inicializar o formulário com os campos e validações
  form(){
      
    this.formulario = this.formBuilder.group({
     
      nome: ['',[Validators.required, Validators.minLength(6)]],
      corretor:['',[Validators.required, Validators.minLength(8)]],
      setores: this.formBuilder.array([]),  // Inicializa o FormArray vazio
      guiches: this.formBuilder.array([])  // Inicializa o FormArray vazio
      
    })      
  }
}
